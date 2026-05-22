import requests
from django.shortcuts import render
from django.http import JsonResponse
def index(request):
    return render(request, 'translator/index.html')
def translate(request):
    if request.method == 'POST':
        text = request.POST.get('text', '')
        src_lang = request.POST.get('src_lang', 'en')
        tgt_lang = request.POST.get('tgt_lang', 'uz')
        try:
            # Model server is not yet deployed, so this is a placeholder
            # response = requests.post('http://model-server/translate', json={'text': text, 'src': src_lang, 'tgt': tgt_lang})
            # translation = response.json().get('translation', '')
            translation = f"Translated: {text}"
        except Exception:
            translation = "Error: Model server unreachable"
        return JsonResponse({'translation': translation})
    return JsonResponse({'error': 'Invalid request'}, status=400)
