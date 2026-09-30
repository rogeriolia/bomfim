"""
4Lia.Bomfim - Arquivo principal para executar a aplicação
Versão: 1.0.0
"""
import sys
import os
from pathlib import Path

# Adicionar o diretório atual ao path do Python
sys.path.insert(0, str(Path(__file__).parent))

from bomfim import create_app
from bomfim.config import DevelopmentConfig, ProductionConfig

# Selecionar configuração por ambiente
env = os.getenv('BOMFIM_ENV') or os.getenv('FLASK_ENV') or 'development'
config_class = ProductionConfig if env.lower() == 'production' else DevelopmentConfig

# Criar aplicação
app = create_app(config_class)

if __name__ == '__main__':
    print("=" * 70)
    print("Bomfim - Sistema de Gerenciamento")
    print("=" * 70)
    print("Iniciando servidor Flask em modo desenvolvimento...")
    print("Acesse: http://localhost:5000")
    print("Projeto: Bomfim")
    print("=" * 70)
    
    app.run(debug=app.config.get('DEBUG', False), host='0.0.0.0', port=5000, use_reloader=True, extra_files=['.env'])
