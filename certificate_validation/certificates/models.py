from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.conf import settings

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.CharField(max_length=100, blank=True)
    join_date = models.DateField(auto_now_add=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    current_rank = models.IntegerField(default=0)
    total_weightage = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)

    def __str__(self):
        return f"{self.user.email}'s Profile"

class Certificate(models.Model):
    STATUS_CHOICES = [
        ('verified', 'Verified'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    domain = models.CharField(max_length=100)
    weightage = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    upload_date = models.DateTimeField(auto_now_add=True)
    verification_date = models.DateTimeField(null=True, blank=True)
    certificate_file = models.FileField(upload_to='certificates/')
    blockchain_tx_hash = models.CharField(max_length=255, null=True, blank=True)
    file_hash = models.CharField(max_length=64, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.user.email})"

class Domain(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    certificate_count = models.IntegerField(default=0)
    total_weightage = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)

    def __str__(self):
        return f"{self.name} ({self.user.email})"

class RankHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.DateField()  # Store first day of each month
    rank = models.IntegerField()

    def __str__(self):
        return f"Rank {self.rank} for {self.user.email} ({self.month})"

class BlockchainVerification(models.Model):
    certificate = models.OneToOneField(Certificate, on_delete=models.CASCADE)
    transaction_hash = models.CharField(max_length=255)
    verification_timestamp = models.DateTimeField(auto_now_add=True)
    blockchain_network = models.CharField(max_length=100)
    verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Verification for {self.certificate.name}"

class Course(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    course_name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    username = models.CharField(max_length=100, blank=True)  # stores combined name

    def save(self, *args, **kwargs):
        if not self.username:
            # Combine first and last name from the User model
            full_name = f"{self.user.first_name} {self.user.last_name}".strip()
            self.username = full_name 
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.course_name} by {self.issuer} for {self.username}"


class OCRExtraction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    certificate_file = models.FileField(upload_to='ocr_extracted_certificates/')
    extracted_name = models.CharField(max_length=255)
    extracted_issuer = models.CharField(max_length=255)
    extracted_course = models.CharField(max_length=255)
    extraction_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OCR Data for {self.user.email} on {self.extraction_date.date()}"




