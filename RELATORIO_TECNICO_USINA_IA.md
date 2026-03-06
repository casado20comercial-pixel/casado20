# Relatório Técnico: Usina de IA de Catálogos - Casa do 20

Este projeto documenta a implementação de uma camada de inteligência proprietária para a **Casa do 20**, focada em transformar catálogos PDF tradicionais em uma vitrine digital de alta performance.

## 🎯 Status do Projeto: 100% Operacional

O sistema encontra-se com sua infraestrutura de e-commerce totalmente integrada:
- **Catálogo Digital**: Interface ultra-rápida sincronizada com o ERP Hiper.
- **WhatsApp Checkout**: Fluxo de conversão direto para vendedores.
- **Acervo Mestre**: Banco de imagens proprietário com ~1.300 arquivos otimizados.

---

## 🏗️ A "Usina de IA": Arquitetura e Estratégia

Para superar a baixa qualidade de dados comuns em buscas na web, optamos pela extração direta de **Fontes Oficiais (PDFs)**.

### 1. Motor de Extração de Catálogos
- **Visão Computacional**: Utilizamos o **Google Gemini 2.0 Flash** para escanear páginas de catálogos e extrair produtos, códigos (EAN/Ref) e preços.
- **Processamento de Imagem**: Uso da biblioteca `Sharp` para recortes com padding de segurança, compressão WebP e geração de `phash` (Perceptual Hash) para evitar duplicidade no acervo.

### 2. O "Modo Radical" de Matching
Implementamos uma lógica de vinculação automática (BFF) que prioriza a segurança absoluta para o cliente:
- **Soberania do EAN**: Vínculo instantâneo se o código de barras no PDF bater com o ERP.
- **Filtro de Atributos**: Bloqueio de matches se houver divergência em Litragem, Quantidade (Kit vs Unitário) ou Dimensões.
- **Match Agressivo (Ajuste Final)**: Para a migração inicial, a trava de preço foi relaxada, permitindo que produtos com nomes idênticos fossem vinculados mesmo havendo diferença entre atacado e varejo.

---

## 🛠️ Tecnologias e Manutenção

- **AI**: Gemini 2.0 Flash (via Google Generative AI SDK).
- **Backend**: Supabase (Postgres + Storage).
- **Frontend**: Next.js 15 (App Router).

### Recomendações para a Nova Equipe:
1. **Novos Produtos**: Carregar PDFs oficiais na aba Admin > Upload para extração automática.
2. **Escalabilidade**: Para lidar com catálogos de 500+ páginas, recomenda-se mover o processamento para uma fila assíncrona (como BullMQ).
3. **Curadoria**: A aba "Acervo" permite a revisão manual das imagens extraídas antes de entrarem na vitrine principal.

---
*Relatório consolidado para entrega técnica final.*
