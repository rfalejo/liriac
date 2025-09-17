from django.contrib import admin

# mypy: disable-error-code=type-arg
from . import models


@admin.register(models.Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "slug", "created_at", "last_opened")
    search_fields = ("title", "slug")


@admin.register(models.Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "order", "title", "updated_at")
    list_filter = ("book",)
    search_fields = ("title", "body")


@admin.register(models.Persona)
class PersonaAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "role", "created_at")
    search_fields = ("name", "role")


@admin.register(models.ContextProfile)
class ContextProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "chapter", "tokens_estimated", "token_limit")
    raw_id_fields = ("chapter",)


@admin.register(models.ContextProfilePersona)
class ContextProfilePersonaAdmin(admin.ModelAdmin):
    list_display = ("id", "context_profile", "persona", "enabled", "created_at")
    list_filter = ("enabled",)
    raw_id_fields = ("context_profile", "persona")


@admin.register(models.ChapterVersion)
class ChapterVersionAdmin(admin.ModelAdmin):
    list_display = ("id", "chapter", "diff_size", "created_at")
    raw_id_fields = ("chapter",)
