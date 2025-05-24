from django.contrib.auth import authenticate
from django.http import HttpResponseRedirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from social_django.views import complete
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import Coalesce
from django.db.models import DecimalField
from .models import Certificate, UserProfile, Domain, RankHistory, BlockchainVerification, OCRExtraction , Course
import json
import urllib.parse
from rest_framework.permissions import IsAuthenticated
import os
from django.conf import settings
import logging
from decimal import Decimal
from paddleocr import PaddleOCR
from fuzzywuzzy import fuzz
from fuzzywuzzy import process


logger = logging.getLogger(__name__)

User = get_user_model()

ALLOWED_COURSES = ["python", "java", "ruby", "sql", "mongodb"]

ocr_engine = PaddleOCR(use_angle_cls=True, lang='en')

ISSUER_WEIGHTS = {
    "Coursera": 9.5,
    "Udemy": 7.0,
    "LinkedIn Learning": 8.5,
    "Microsoft Learn": 8.5,
    "Amazon Web Services (AWS)": 9.0,
    "edX": 9.5,
    "Udacity": 9.0,
    "PMP": 10.0,
    "ITIL": 9.0,
    "HubSpot Academy": 7.0,
    "FutureLearn": 6.5,
    "Great Learning": 7.5,
    "Skillshare": 6.0,
    "Alison": 6.5,
    "freeCodeCamp": 8.0,
    "CodeSignal": 8.5,
    "OpenLearn": 6.5,
    "NPTEL": 8.5,
    "SWAYAM": 8.0,
    "Google": 9.0
}

COURSE_DIFFICULTY = {
    "Python": 7.0,
    "Java": 7.5,
    "Ruby": 6.0,
    "SQL": 7.0,
    "MongoDB": 7.5
}

def update_user_ranks():
    """Update total_weightage and current_rank for all users based on certificate weightage."""
    try:
        users = UserProfile.objects.annotate(
            cert_total_weightage=Coalesce(
                Sum('user__certificate__weightage'),
                Decimal('0.0'),
                output_field=DecimalField()
            )
        ).order_by('-cert_total_weightage', 'user__email')

        if not users.exists():
            logger.info("No users found for rank and weightage update")
            return

        for rank, user_profile in enumerate(users, 1):
            # Update total_weightage if different
            if user_profile.total_weightage != user_profile.cert_total_weightage:
                user_profile.total_weightage = user_profile.cert_total_weightage
                logger.info(f"Updated total_weightage for {user_profile.user.email} to {user_profile.total_weightage}")
            # Update current_rank if different
            if user_profile.current_rank != rank:
                user_profile.current_rank = rank
                logger.info(f"Updated rank for {user_profile.user.email} to {rank}")
            user_profile.save()
        logger.info("User ranks and weightage updated successfully")
    except Exception as e:
        logger.error(f"update_user_ranks error: {str(e)}")

# Authentication Views
class SignupView(APIView):
    def post(self, request):
        try:
            data = request.data
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')

            if not email or not password:
                return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

            if len(password) < 8:
                return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            profile = UserProfile.objects.create(user=user)
            token, created = Token.objects.get_or_create(user=user)

            # Update ranks and weightage to include new user
            update_user_ranks()

            return Response({
                'message': 'User created successfully',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                },
                'profile': {
                    'department': profile.department,
                    'join_date': profile.join_date.isoformat(),
                    'current_rank': profile.current_rank,
                    'total_weightage': float(profile.total_weightage)
                }
            }, status=status.HTTP_201_CREATED)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"SignupView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SigninView(APIView):
    def post(self, request):
        try:
            data = request.data
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

            user = authenticate(request, email=email, password=password)
            if user is None:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

            token, created = Token.objects.get_or_create(user=user)
            profile = user.userprofile  # Fetch fresh profile
            # Ensure ranks and weightage are up-to-date
            update_user_ranks()

            return Response({
                'message': 'Login successful',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                },
                'profile': {
                    'department': profile.department,
                    'join_date': profile.join_date.isoformat(),
                    'current_rank': profile.current_rank,
                    'total_weightage': float(profile.total_weightage)
                }
            }, status=status.HTTP_200_OK)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"SigninView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Token.objects.filter(user=request.user).delete()
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"LogoutView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def google_auth_complete(request, *args, **kwargs):
    response = complete(request, backend='google-oauth2', *args, **kwargs)
    if request.user.is_authenticated:
        user = request.user
        if not hasattr(user, 'userprofile'):
            UserProfile.objects.create(user=user)
        profile = user.userprofile
        token, created = Token.objects.get_or_create(user=user)
        # Update ranks and weightage for Google auth
        update_user_ranks()
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
        profile_data = {
            'department': profile.department,
            'join_date': profile.join_date.isoformat(),
            'current_rank': profile.current_rank,
            'total_weightage': float(profile.total_weightage)
        }
        frontend_url = 'http://localhost:8080/login'
        query_params = urllib.parse.urlencode({
            'token': token.key,
            'user': json.dumps(user_data),
            'profile': json.dumps(profile_data)
        })
        return HttpResponseRedirect(f'{frontend_url}?{query_params}')
    return Response({'error': 'Google authentication failed'}, status=status.HTTP_400_BAD_REQUEST)

# Other Views
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            profile = user.userprofile
            certificates = Certificate.objects.filter(user=user)
            domains = Domain.objects.filter(user=user)

            # Ensure ranks and weightage are up-to-date
            update_user_ranks()

            total_weightage = profile.total_weightage
            total_certificates = certificates.count()
            current_rank = profile.current_rank

            recent_certificates = certificates.order_by('-upload_date')[:5].values(
                'id', 'name', 'status', 'upload_date'
            )

            domain_progress = domains.values('name', 'certificate_count', 'total_weightage')

            return Response({
                'stats': {
                    'total_weightage': total_weightage,
                    'total_certificates': total_certificates,
                    'current_rank': current_rank
                },
                'recent_certificates': list(recent_certificates),
                'domain_progress': list(domain_progress)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"DashboardView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CertificateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            search = request.query_params.get('search', '')
            domain = request.query_params.get('domain', '')
            cert_status = request.query_params.get('status', '')

            certificates = Certificate.objects.filter(user=user)
            if search:
                certificates = certificates.filter(name__icontains=search)
            if domain:
                certificates = certificates.filter(domain=domain)
            if cert_status:
                certificates = certificates.filter(status=cert_status)

            certificates = certificates.order_by('-upload_date').values(
                'id', 'name', 'issuer', 'category', 'domain', 'weightage', 'status', 'upload_date'
            )
            return Response({'certificates': list(certificates)}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"CertificateListView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CertificateUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            data = request.data
            certificate_file = request.FILES.get('certificate_file')

            if not certificate_file:
                return Response({'error': 'Certificate file is required'}, status=status.HTTP_400_BAD_REQUEST)

            certificate_name = data.get('name', certificate_file.name)

            if Certificate.objects.filter(user=user, name=certificate_name).exists():
                return Response({'error': 'Certificate with this name already exists'}, status=status.HTTP_400_BAD_REQUEST)

            # OCR Processing
            ocr = PaddleOCR(use_angle_cls=True, lang='en')
            ocr_result = ocr.ocr(certificate_file.temporary_file_path(), cls=True)
            extracted_text = ' '.join([line[1][0] for block in ocr_result for line in block])

            # Extract possible fields from OCR (naive match)
            extracted_issuer = next((key for key in ISSUER_WEIGHTS.keys() if key.lower() in extracted_text.lower()), None)
            extracted_course = next((key for key in COURSE_WEIGHTS.keys() if key.lower() in extracted_text.lower()), None)
            extracted_name = f"{user.first_name} {user.last_name}".strip()

            # Compare user input with OCR extracted data
            input_issuer = data.get("issuer", "")
            input_course = data.get("course_name", "")

            issuer_match = fuzz.token_sort_ratio(input_issuer.lower(), extracted_issuer.lower()) if extracted_issuer else 0
            course_match = fuzz.token_sort_ratio(input_course.lower(), extracted_course.lower()) if extracted_course else 0
            name_match = fuzz.token_sort_ratio(extracted_name.lower(), extracted_text.lower())

            if issuer_match < 80 or course_match < 80 or name_match < 80:
                return Response({
                    'error': 'Certificate details do not match OCR results',
                    'ocr_result': {
                        'issuer': extracted_issuer,
                        'course': extracted_course,
                        'name': extracted_name,
                        'issuer_match': issuer_match,
                        'course_match': course_match,
                        'name_match': name_match
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            # Assign weightage from predefined mappings
            issuer_weight = ISSUER_WEIGHTS.get(extracted_issuer, 5.0)
            course_weight = COURSE_WEIGHTS.get(extracted_course.lower(), 5.0)
            final_weightage = round((issuer_weight + course_weight) / 2, 2)

            # Save Certificate
            certificate = Certificate.objects.create(
                user=user,
                name=certificate_name,
                issuer=extracted_issuer,
                weightage=final_weightage,
                status='pending',
                certificate_file=certificate_file
            )

            # Save Course
            Course.objects.create(
                user=user,
                course_name=extracted_course,
                issuer=extracted_issuer
            )

            # Update user profile total weightage
            profile = user.userprofile
            profile.total_weightage += final_weightage
            profile.save()

            # Update domain info
            domain, _ = Domain.objects.get_or_create(user=user, name='General')
            domain.certificate_count += 1
            domain.total_weightage += final_weightage
            domain.save()

            # Update user rankings
            update_user_ranks()

            return Response({
                'message': 'Certificate uploaded and verified successfully',
                'certificate': {
                    'id': certificate.id,
                    'name': certificate.name,
                    'issuer': certificate.issuer,
                    'course': extracted_course,
                    'weightage': final_weightage,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"CertificateUploadView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            profile = user.userprofile
            domains = Domain.objects.filter(user=user)
            rank_history = RankHistory.objects.filter(user=user).order_by('month').values('month', 'rank')

            # Ensure ranks and weightage are up-to-date
            update_user_ranks()

            return Response({
                'profile': {
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'department': profile.department,
                    'join_date': profile.join_date.isoformat(),
                    'total_weightage': float(profile.total_weightage),
                    'current_rank': profile.current_rank
                },
                'domains': list(domains.values('name', 'certificate_count', 'total_weightage')),
                'rank_history': list(rank_history)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"ProfileView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            domain = request.query_params.get('domain', '')
            users = UserProfile.objects.all()

            if domain:
                users = users.filter(user__certificate__domain=domain).distinct()

            leaderboard = users.annotate(
                certificate_count=Count('user__certificate'),
                cert_total_weightage=Coalesce(
                    Sum('user__certificate__weightage'),
                    Decimal('0.0'),
                    output_field=DecimalField()
                )
            ).order_by('-cert_total_weightage', 'certificate_count').values(
                'user__email', 'cert_total_weightage', 'certificate_count'
            )[:50]

            # Assign ranks dynamically
            leaderboard_with_ranks = [
                {**entry, 'current_rank': index + 1}
                for index, entry in enumerate(leaderboard)
            ]

            return Response({'leaderboard': leaderboard_with_ranks}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"LeaderboardView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
