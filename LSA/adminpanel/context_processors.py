from .models import SocialLink, Location

def social_links_and_locations(request):
    # Fetch all social links and locations
    social_links = SocialLink.objects.all()
    locations = Location.objects.all()
    
    # Return both as context variables
    return {'social_links': social_links, 'locations': locations}