from . import views
from django.urls import path

urlpatterns = [
    path('', views.index, name='index'),
    path('translate/', views.translate, name='translate'),
    path('alternative-translate/', views.alternative_translate, name='alternative_translate'),
]
