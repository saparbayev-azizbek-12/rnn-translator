import requests

MODELS_CONFIG = {
    'fra-eng': {
        'url': 'https://saparbayev-azizbek-rnn-translator-fra-en.hf.space/translate',
        'src': 'French',
        'tgt': 'English',
        'src_code': 'fr',
        'tgt_code': 'en'
    },
    'eng-fra': {
        'url': 'https://saparbayev-azizbek-rnn-translator-en-fra.hf.space/translate',
        'src': 'English',
        'tgt': 'French',
        'src_code': 'en',
        'tgt_code': 'fr'
    },
    'eng-rus': {
        'url': 'https://saparbayev-azizbek-rnn-translator-eng-rus.hf.space/translate',
        'src': 'English',
        'tgt': 'Russian',
        'src_code': 'en',
        'tgt_code': 'ru'
    }
}

def translate_with_rnn(text, model_id):
    config = MODELS_CONFIG.get(model_id)
    if not config:
        return "Error: Invalid model selection"
    
    try:
        response = requests.post(config['url'], json={'text': text}, timeout=10)
        if response.status_code == 200:
            return response.json().get('translated', '')
        return f"Error: Model server error ({response.status_code})"
    except Exception as e:
        return f"Error: {str(e)}"

def get_alternative_translation(text, model_id):
    config = MODELS_CONFIG.get(model_id)
    if not config:
        return "Error: Invalid model selection"
        
    try:
        url = "https://api.mymemory.translated.net/get"
        params = {
            'q': text,
            'langpair': f"{config['src_code']}|{config['tgt_code']}"
        }
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            translation = data.get('responseData', {}).get('translatedText')
            if translation:
                return translation
            
        return "Error: Alternative translation service is temporarily unavailable."
    except Exception as e:
        return f"Error: {str(e)}"
