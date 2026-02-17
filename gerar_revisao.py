import os

# Extensões que queremos ler
extensoes_validas = ['.ts', '.tsx', '.css']
# Pastas para ignorar
ignorar_pastas = ['node_modules', 'dist', '.git', '.vscode']
# Arquivo de saída
arquivo_saida = 'codigo_completo.txt'

with open(arquivo_saida, 'w', encoding='utf-8') as outfile:
    for root, dirs, files in os.walk('src'):
        # Remove pastas ignoradas da busca
        dirs[:] = [d for d in dirs if d not in ignorar_pastas]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensoes_validas):
                caminho_completo = os.path.join(root, file)
                
                # Escreve um cabeçalho para separar os arquivos
                outfile.write(f"\n{'='*50}\n")
                outfile.write(f"ARQUIVO: {caminho_completo}\n")
                outfile.write(f"{'='*50}\n\n")
                
                try:
                    with open(caminho_completo, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"Erro ao ler arquivo: {e}")

print(f"Sucesso! O arquivo '{arquivo_saida}' foi criado.")
print("Agora você pode fazer upload dele ou colar o conteúdo no chat.")