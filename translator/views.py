from django.shortcuts import render
from django.http import JsonResponse
from .services import translate_with_rnn, get_alternative_translation

def index(request):
    return render(request, 'translator/index.html')

def translate(request):
    if request.method == 'POST':
        text = request.POST.get('text', '')
        model_id = request.POST.get('model', 'fra-eng')
        
        if not text:
            return JsonResponse({'translation': ''})
            
        translation = translate_with_rnn(text, model_id)
        return JsonResponse({'translation': translation})
        
    return JsonResponse({'error': 'Invalid request'}, status=400)

def alternative_translate(request):
    if request.method == 'POST':
        text = request.POST.get('text', '')
        model_id = request.POST.get('model', 'fra-eng')
        
        if not text:
            return JsonResponse({'translation': ''})
            
        translation = get_alternative_translation(text, model_id)
        return JsonResponse({'translation': translation})
        
    return JsonResponse({'error': 'Invalid request'}, status=400)
