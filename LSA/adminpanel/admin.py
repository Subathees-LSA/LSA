from django.contrib import admin
from .models import *


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


admin.site.register(TicketTransaction)

@admin.register(admin_dashboard_preview)
class admindashboardpreviewAdmin(admin.ModelAdmin):
    list_display = ['name','identifier']
    #readonly_fields = ['type']
    #exclude = ['type']

@admin.register(admin_navbar_access)
class admin_navbar_accessAdmin(admin.ModelAdmin):
    list_display = ('name', 'url_name')

    def resolved_url(self, obj):
        return obj.get_url()
    resolved_url.short_description = "Resolved URL"
    
@admin.register(adminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    filter_horizontal = ('navbar_access','dashboard_preview',)

admin.site.register(ConversionRate)



@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'description', 'created_at')  # Display message in list view
    search_fields = ('name', 'email', 'description')  # Search includes message content
    list_filter = ('created_at',)  # Filter by creation date
    readonly_fields = ('created_at',)  # Makes created_at read-only
    ordering = ('-created_at',)  # Orders by newest first

    # Add a custom action to mark messages as "processed"
    actions = ['mark_as_processed']

    def mark_as_processed(self, request, queryset):
        queryset.update(description="Processed")
        self.message_user(request, "Selected messages marked as processed.")
    mark_as_processed.short_description = "Mark selected messages as processed"

admin.site.register(LotteryCategory)