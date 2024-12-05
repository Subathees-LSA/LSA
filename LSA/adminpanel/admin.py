from django.contrib import admin
from .models import LotteryEvent, LotteryEventImages, adminProfile

# Inline for adding multiple images
class LotteryEventImagesInline(admin.TabularInline):  # Use StackedInline for a vertical layout
    model = LotteryEventImages
    extra = 3  # Number of empty image fields displayed by default
    fields = ('image', 'uploaded_at')  # Display these fields in the inline admin form
    readonly_fields = ('uploaded_at',)  # Make 'uploaded_at' read-only

@admin.register(LotteryEvent)
class LotteryEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'draw_date')
    list_filter = ('is_active', 'draw_date')
    search_fields = ('title', 'description')
    inlines = [LotteryEventImagesInline]  # Add the inline for images

@admin.register(LotteryEventImages)
class LotteryEventImagesAdmin(admin.ModelAdmin):
    list_display = ('lottery_event', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('lottery_event__title',)

admin.site.register(adminProfile)