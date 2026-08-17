# Site da Be Medical

Site institucional da Be Medical — equipamentos e software para análise de pele e capilar.
Endereço: **bemedical.com.br**

## Como trocar um texto

1. Clique em **`index.html`** na lista de arquivos acima
2. Clique no **ícone de lápis** (canto superior direito)
3. Ache a frase que quer mudar — os blocos estão marcados com comentários:
   `ABERTURA`, `PRECISÃO`, `CONTATO E RODAPÉ`
4. Altere **apenas o texto entre `>` e `<`**
5. Clique em **Commit changes**

Em cerca de um minuto o site no ar já mostra a alteração.

> Deu errado? Nada se perde. Toda versão fica guardada na aba **Commits** — dá para voltar
> para qualquer uma delas.

## Como trocar uma imagem

As três imagens ficam em `imagens/`. Suba o arquivo novo com **o mesmo nome** do antigo e
ele é substituído sem mexer em código.

| Arquivo | Onde aparece |
| --- | --- |
| `imagem_rigor.jpg` | Card 01 — Precisão no diagnóstico |
| `imagem_entendimento.jpg` | Card 02 — Segurança na conduta |
| `imagem_tempo.jpg` | Card 03 — Prova do resultado |

## O que é cada arquivo

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | A página inteira: todos os textos e a estrutura |
| `assets/style.css` | Todo o visual: cores, tamanhos, espaçamentos |
| `assets/scan.js` | A animação da varredura que forma o "be" |
| `assets/logo-be.svg` | Monograma usado pela animação |
| `assets/logo-be-medical-wordmark.svg` | Logo do menu e do rodapé |
| `imagens/` | As fotos dos três cards |
| `CNAME` | Diz ao GitHub qual é o domínio. **Não apagar** |

## Detalhe técnico

Ao alterar `style.css` ou `scan.js`, incremente o número em `?v=` dentro do `index.html`.
Isso obriga o navegador de quem já visitou a baixar a versão nova em vez de usar a antiga.
