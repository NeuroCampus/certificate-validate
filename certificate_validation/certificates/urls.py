from django.urls import path, include
from .views import (
    SignupView, SigninView, LogoutView, google_auth_complete,
    DashboardView, CertificateListView, CertificateUploadView,
    LeaderboardView, ProfileView
)
from social_django.urls import urlpatterns as social_urls

urlpatterns = [
    path('api/signup/', SignupView.as_view(), name='signup'),
    path('api/signin/', SigninView.as_view(), name='signin'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('auth/google/callback/', google_auth_complete, name='social-auth-complete'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/certificates/', CertificateListView.as_view(), name='certificate_list'),
    path('api/certificates/upload/', CertificateUploadView.as_view(), name='certificate_upload'),
    path('api/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('', include((social_urls, 'social'), namespace='social')),
]