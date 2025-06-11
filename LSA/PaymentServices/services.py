from django.shortcuts import render
from rest_framework.response import Response
from django.shortcuts import render, redirect

def success(request):

    response = render(request, 'success.html')
    
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    
    response.set_cookie('cart', '{}', max_age=7 * 24 * 60 * 60, httponly=True, secure=False)
    return response


def cancel(request):
    return render(request,'cancel.html')

def my_order(request):
    if not request.user.is_authenticated:
        return redirect('/login/')  
    return render(request, 'myorder.html')



