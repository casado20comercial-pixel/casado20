# 🏪 Casa do 20 - Vitrine Digital de Alta Performance

Este projeto substitui o catálogo nativo do ERP Hiper por uma vitrine digital moderna, de alta performance e focada em conversão para a loja **Casa do 20**. O objetivo é oferecer uma experiência de compra "App-Like" otimizada para dispositivos móveis, com integração direta para vendas via WhatsApp.

---

## 🎯 Situação Atual e Motivação do Projeto

O projeto foi desenvolvido para transformar a experiência de compra digital da Casa do 20:

1.  **Velocidade e Conversão**: Uma interface rápida e intuitiva que direciona o cliente para a finalização do pedido diretamente no WhatsApp do vendedor.
2.  **Sincronização ERP**: Integração em tempo real com o **ERP Hiper** para preços e estoques, garantindo que a vitrine reflita sempre a realidade do estoque.
3.  **Curadoria de Imagens**: Após testes intensivos com automação via IA para 5.000 produtos, o projeto evoluiu para um modelo de **curadoria assistida**, priorizando a qualidade visual da vitrine sobre a quantidade automatizada.

## 🛠️ Stack de Tecnologias

A arquitetura garante performance, escalabilidade e segurança:

*   **Frontend**: Next.js 15 (App Router), Tailwind CSS e Shadcn UI.
*   **Backend**: Route Handlers (Next.js) atuando como BFF para orquestrar chamadas seguras.
*   **Banco de Dados & Storage**: Supabase (PostgreSQL) e Supabase Storage para imagens em formato `.webp` otimizado.
*   **Integração ERP**: API REST do **ERP Hiper** para dados de produtos e estoque.
*   **Inteligência Artificial**: Google Gemini API (utilizado na validação e processamento de informações).

## 🏗️ Arquitetura e Engenharia de Software

### 1. Sincronização com ERP Hiper
*   **Segurança**: Comunicação backend-to-backend centralizada, protegendo chaves de acesso.
*   **Ponto de Sincronização**: Preparado para atualizações diferenciais, reduzindo latência e consumo de dados.

### 2. Gestão de Imagens e Vitrine
*   **Processamento de Imagens**: Motor Sharp para conversão e otimização em WebP, garantindo carregamento instantâneo.
*   **Abordagem de Curadoria**: O sistema privilegia a fidelidade visual. Produtos sem imagem processada utilizam um placeholder premium, mantendo a estética da loja enquanto a curadoria manual ou assistida é realizada nos itens prioritários.

### 3. Foco em Experiência do Usuário (UX)
*   **Checkout via WhatsApp**: Ao finalizar o carrinho, o sistema gera uma mensagem estruturada com os itens, preços e links, facilitando o fechamento imediato.
*   **Design Mobile-First**: Interface inspirada em apps nativos de grandes players (Amazon, Westwing), focada na facilidade de uso em celulares.

---

## 📄 Relatórios Técnicos
Para detalhes sobre os desafios de automação e análise de viabilidade de dados, consulte:
- [Relatório Técnico: Inteligência Artificial na Usina de Vendas](./RELATORIO_TECNICO_USINA_IA.md)
# ecommercec20
