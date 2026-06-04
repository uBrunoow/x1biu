from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Song
from .tasks import extract_song_pitch


@admin.register(Song)
class SongAdmin(ModelAdmin):
    list_display = ["title", "artist", "duration_ms", "processing_status", "is_active"]
    list_filter = ["is_active", "processing_status"]
    search_fields = ["title", "artist"]
    readonly_fields = ["audio_url", "duration_ms", "pitch_reference", "processing_status"]

    def save_model(self, request, obj, form, change):
        new_file = "audio_file" in form.changed_data
        super().save_model(request, obj, form, change)
        if new_file and obj.audio_file:
            extract_song_pitch.delay(obj.id)
