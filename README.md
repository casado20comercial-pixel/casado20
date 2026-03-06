# 🏪 Casa do 20 - Vitrine Digital de Alta Performance

Este projeto representa a evolução da experiência de compra para a **Casa do 20**. Substituímos o catálogo estático e limitado por uma vitrine digital moderna, ultra-rápida (App-Like) e otimizada para conversão via WhatsApp.

---

## 🎯 Visão do Produto e Diferenciais

O ecossistema foi desenhado para eliminar fricções no processo de venda:

1.  **Experiência App-Like**: Interface fluida, inspirada em aplicativos nativos (Amazon, Westwing), garantindo navegação instantânea em dispositivos móveis.
2.  **Conversão via WhatsApp**: Checkout inteligente que gera uma mensagem estruturada com itens, preços e links, direcionando o cliente diretamente para o fechamento com o vendedor.
3.  **Sincronização Inteligente com ERP Hiper**: Integração em tempo real de preços e estoques, com lógica de "Ponto de Sincronização" para economia de dados e latência mínima.
4.  **Curadoria de Imagens (Usina de IA)**: Em vez de buscas genéricas na internet, utilizamos o **Gemini 2.0 Flash** para extrair imagens oficiais de catálogos PDF com precisão cirúrgica.

## 🛠️ Stack Tecnológica

A arquitetura foi escolhida para garantir escala e performance extrema:

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router) para SSR e performance otimizada.
*   **Design System**: Tailwind CSS + Shadcn UI (Customizado para "Casa do 20").
*   **Inteligência Artificial**: [Google Gemini 2.0 Flash](https://deepmind.google/technologies/gemini/) (Visão Computacional e Extração de Dados em PDFs).
*   **Backend & DB**: [Supabase](https://supabase.com/) (PostgreSQL + Storage) para persistência e gestão de ativos digitais.
*   **Processamento de Imagem**: [Sharp](https://sharp.pixelplumbing.com/) para compressão WebP e geração de Perceptual Hash (Deduplicação).
*   **Integração ERP**: API REST do ERP Hiper (ms-ecommerce).

## 🏗️ Arquitetura de Software

### 1. Camada de Dados (BFF)
O Next.js atua como um Backend-for-Frontend (BFF), orquestrando chamadas seguras para a API do Hiper e o Supabase, protegendo tokens e chaves sensíveis.

### 2. Usina de IA de Catálogos
Um sistema proprietário que:
*   Processa PDFs de fornecedores em alta resolução.
*   Usa Gemini Vision para detectar produtos, preços e códigos (EAN/Ref).
*   Aplica o **Modo Radical** de vinculação, exigindo alta confiança (EAN match ou preço < 35% de divergência).

### 3. Gestão de Ativos
Imagens são processadas, recortadas com padding de segurança e servidas em formato WebP otimizado via Supabase Storage.

---

## 📄 Documentação Técnica Detalhada

Para uma visão aprofundada sobre os desafios de automação e a engenharia por trás do banco de imagens:
- [Relatório Técnico: Usina de IA e Viabilidade](./RELATORIO_TECNICO_USINA_IA.md)

---
*Desenvolvido com foco em performance e experiência do usuário (UX).*
