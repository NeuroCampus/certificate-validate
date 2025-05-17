from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from rest_framework.authtoken.models import Token
from certificates.models import User, UserProfile, Certificate, Domain, RankHistory, BlockchainVerification

# Admin for User model
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'is_active', 'is_staff'),
        }),
    )
    ordering = ('email',)
    readonly_fields = ('date_joined', 'last_login')

# Admin for UserProfile model
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'join_date', 'current_rank', 'total_weightage')
    search_fields = ('user__email', 'department')
    list_filter = ('join_date', 'current_rank')
    fields = ('user', 'department', 'join_date', 'profile_image', 'current_rank', 'total_weightage')
    readonly_fields = ('join_date',)
    autocomplete_fields = ['user']

# Admin for Certificate model
@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'issuer', 'domain', 'status', 'weightage', 'upload_date')
    search_fields = ('name', 'user__email', 'issuer', 'domain')
    list_filter = ('status', 'domain', 'upload_date', 'category')
    fields = (
        'user', 'name', 'issuer', 'category', 'domain', 'weightage', 'status',
        'upload_date', 'verification_date', 'certificate_file', 'blockchain_tx_hash'
    )
    readonly_fields = ('upload_date', 'verification_date')
    autocomplete_fields = ['user']

# Admin for Domain model
@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'certificate_count', 'total_weightage')
    search_fields = ('name', 'user__email')
    list_filter = ('name',)
    fields = ('user', 'name', 'certificate_count', 'total_weightage')
    autocomplete_fields = ['user']

# Admin for RankHistory model
@admin.register(RankHistory)
class RankHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'month', 'rank')
    search_fields = ('user__email',)
    list_filter = ('month', 'rank')
    fields = ('user', 'month', 'rank')
    autocomplete_fields = ['user']

# Admin for BlockchainVerification model
@admin.register(BlockchainVerification)
class BlockchainVerificationAdmin(admin.ModelAdmin):
    list_display = ('certificate', 'transaction_hash', 'blockchain_network', 'verified', 'verification_timestamp')
    search_fields = ('certificate__name', 'transaction_hash')
    list_filter = ('verified', 'blockchain_network', 'verification_timestamp')
    fields = ('certificate', 'transaction_hash', 'blockchain_network', 'verified', 'verification_timestamp')
    readonly_fields = ('verification_timestamp',)
    autocomplete_fields = ['certificate']

# Admin for Token model
@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ('key', 'user', 'created')
    search_fields = ('user__email', 'key')
    list_filter = ('created',)
    readonly_fields = ('created',)
    autocomplete_fields = ['user']

# Register the User model
admin.site.register(User, UserAdmin)