import requests
from django.shortcuts import render
from django.http import JsonResponse
def index(request):
    return render(request, 'translator/index.html')
def translate(request):
    if request.method == 'POST':
        text = request.POST.get('text', '')
        if not text:
            return JsonResponse({'translation': ''})
            
        try:
            # Hugging Face Spaces endpoint
            url = 'https://saparbayev-azizbek-rnn-translator-fra-en.hf.space/translate'
            response = requests.post(url, json={'text': text}, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                translation = data.get('translated', '')
            else:
                translation = f"Error: Model server returned status {response.status_code}"
        except requests.exceptions.RequestException as e:
            translation = f"Error: Model server unreachable ({str(e)})"
        except Exception as e:
            translation = f"Error: {str(e)}"
            
        return JsonResponse({'translation': translation})
    return JsonResponse({'error': 'Invalid request'}, status=400)
