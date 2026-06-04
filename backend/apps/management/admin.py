from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from unfold.admin import ModelAdmin
from .models import User


class CustomUserAdmin(ModelAdmin, UserAdmin):
    model = User
    ordering = ["email"]
    list_display = ["email", "nickname", "wins", "losses", "is_staff"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informações pessoais", {"fields": ("first_name", "last_name")}),
        ("Jogo", {"fields": ("nickname", "wins", "losses")}),
        ("Permissões", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Datas", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "nickname", "password1", "password2")}),
    )


admin.site.register(User, CustomUserAdmin)
