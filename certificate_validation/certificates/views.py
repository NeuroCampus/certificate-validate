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
from django.db.models import DecimalField  # Added for output_field
from .models import Certificate, UserProfile, Domain, RankHistory, BlockchainVerification
import json
import urllib.parse
from rest_framework.permissions import IsAuthenticated
import os
from django.conf import settings
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

User = get_user_model()

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
            profile = user.userprofile
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

            ocr_data = {
                'name': data.get('name', ''),
                'issuer': data.get('issuer', ''),
                'category': data.get('category', ''),
                'domain': data.get('domain', ''),
                'weightage': float(data.get('weightage', 0.0))
            }

            certificate = Certificate.objects.create(
                user=user,
                name=ocr_data['name'] or certificate_file.name,
                issuer=ocr_data['issuer'] or 'Unknown',
                category=ocr_data['category'] or 'General',
                domain=ocr_data['domain'] or 'General',
                weightage=ocr_data['weightage'] or 0.0,
                certificate_file=certificate_file
            )

            tx_hash = f"tx_{certificate.id}"
            BlockchainVerification.objects.create(
                certificate=certificate,
                transaction_hash=tx_hash,
                blockchain_network='Ethereum',
                verified=False
            )

            profile = user.userprofile
            profile.total_weightage += Decimal(str(certificate.weightage))
            profile.save()

            domain, created = Domain.objects.get_or_create(user=user, name=certificate.domain)
            domain.certificate_count += 1
            domain.total_weightage += Decimal(str(certificate.weightage))
            domain.save()

            return Response({
                'message': 'Certificate uploaded successfully',
                'certificate': {
                    'id': certificate.id,
                    'name': certificate.name,
                    'status': certificate.status
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"CertificateUploadView error: {str(e)}")
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
                'user__email', 'cert_total_weightage', 'certificate_count', 'current_rank'
            )[:50]

            return Response({'leaderboard': list(leaderboard)}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"LeaderboardView error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            profile = user.userprofile
            domains = Domain.objects.filter(user=user)
            rank_history = RankHistory.objects.filter(user=user).order_by('month').values('month', 'rank')

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