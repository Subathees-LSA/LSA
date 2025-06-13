from django.contrib import admin
from .models import *
from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered
from .models import LotteryEvent, Winner
from PaymentServices.models import  LotteryTicket

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
    inlines = [LotteryEventImagesInline] 

@admin.register(LotteryEventImages)
class LotteryEventImagesAdmin(admin.ModelAdmin):
    list_display = ('lottery_event', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('lottery_event__title',)



@admin.register(admin_dashboard_preview)
class admindashboardpreviewAdmin(admin.ModelAdmin):
    list_display = ['name','identifier','type', 'ordering']
    list_editable = ('ordering',)
    ordering = ['ordering']
    #readonly_fields = ['type']
    #exclude = ['type']

@admin.register(admin_navbar_access)
class admin_navbar_accessAdmin(admin.ModelAdmin):
    list_display = ('name', 'url_name', 'ordering', 'resolved_url') 
    list_editable = ('ordering',) 
    ordering = ['ordering'] 

    def resolved_url(self, obj):
        return obj.get_url()
    resolved_url.short_description = "Resolved URL"
    
@admin.register(adminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    filter_horizontal = ('navbar_access','dashboard_preview',)





@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'description', 'created_at') 
    search_fields = ('name', 'email', 'description') 
    list_filter = ('created_at',) 
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

   
    actions = ['mark_as_processed']

    def mark_as_processed(self, request, queryset):
        queryset.update(description="Processed")
        self.message_user(request, "Selected messages marked as processed.")
    mark_as_processed.short_description = "Mark selected messages as processed"


# social app links
@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'icon') 
    search_fields = ('name', 'title')  # Allow searching by name and title
    
# Our Locations
admin.site.register(Location)

admin.site.register(LotteryCategory)
admin.site.register(Banner)
admin.site.register(Previous_Winner_img)

@admin.register(Winner)
class WinnerAdmin(admin.ModelAdmin):
    list_display = ('user', 'ticket_number', 'lottery_event', 'selection_method')
    list_filter = ('selection_method',)


app_config = apps.get_app_config('adminpanel')
app_models = app_config.get_models()


for model in app_models:
    try:
        admin.site.register(model)
    except AlreadyRegistered:
        pass
