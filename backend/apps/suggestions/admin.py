from django.contrib import admin

# mypy: disable-error-code=type-arg
from . import models


@admin.register(models.Suggestion)
class SuggestionAdmin(admin.ModelAdmin):
    list_display = ("id", "session_id", "chapter", "status", "created_at")
    list_filter = ("status",)
    raw_id_fields = ("chapter",)


@admin.register(models.SuggestionEvent)
class SuggestionEventAdmin(admin.ModelAdmin):
    list_display = ("id", "suggestion", "event_type", "created_at")
    list_filter = ("event_type",)
    raw_id_fields = ("suggestion",)
