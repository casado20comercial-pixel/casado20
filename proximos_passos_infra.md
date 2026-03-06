# Próximos Passos e Infraestrutura - Casa do 20

Este documento serve como um guia estratégico para a evolução do sistema, focando em escalabilidade, custos e qualidade.

## 1. Gestão de Cotas e APIs (Ponto Crítico)
Atualmente, o sistema utiliza o plano gratuito (**Free Tier**) das APIs do Google Gemini.
- **Limitação:** 20 requisições/dia (aproximadamente).
- **Impacto:** O processamento em larga escala trava após o 21º item.
- **Recomendação:** Para operar o catálogo completo (5.000+ itens), é fundamental a ativação do plano *Pay-as-you-go*. O custo é ínfimo perante o valor de uma vitrine sanitizada.

## 2. Estratégias de Redução de Custo SEM perda de Qualidade
Para otimizar o uso de IA no futuro, podemos implementar:
1. **Heurísticas Pré-IA**: Filtros simples (resolução, formato, palavras-chave na URL) que descartam imagens ruins antes de gastar tokens do Gemini.
2. **Cache de Fingerprint**: Se o EAN e a URL da imagem forem os mesmos, o sistema nunca revalida o item, economizando chamadas repetitivas.
3. **Fila de Enriquecimento (Queue)**: Mover o processamento de imagens para um job em segundo plano, evitando timeouts no admin.

## 3. Qualidade Visual e Curadoria
O sistema foi desenhado sob a premissa de **"Segurança Visual"**:
- É melhor exibir um *placeholder* do que uma imagem errada.
- **Dica:** Utilize o status `rejected_ai` no banco para identificar itens que precisam de atenção manual, evitando que o robô tente processá-los infinitamente.

## 4. Arquitetura e Performance
O uso de **Node.js no Backend** em vez de Edge Functions foi uma decisão proposital para:
- Proteger chaves de API sensíveis.
- Permitir processamentos pesados de imagem (Sharp).
- Controlar o tempo de resposta sem as limitações agressivas de timeout das Edge Functions.

## 5. Resumo Estratégico
O software está pronto e é robusto. O sucesso da "automação total" agora depende de:
1. **Saneamento da Base de Dados**: Obter marcas e EANs vinculados corretamente na origem (ERP).
2. **Investimento em Infra**: Ativar faturamento bruto para remover limites artificiais.

## 6. Entrega Final e Migração de Ambiente (Passo Futuro)
Ao concluir a construção do banco de imagens na infraestrutura da Módulo Web, os dados deverão ser migrados para a conta própria do Supabase do cliente:
1. **Migração do Banco (PostgreSQL)**: Exportar e importar as tabelas (`products`, `product_images`, etc.) via SQL ou CSV. A estrutura (schema) é idêntica, garantindo compatibilidade total.
2. **Migração de Arquivos (Storage)**: Transferir as fotos recortadas do bucket `products`.
3. **Ajuste de URLs Públicas**: Como o ID do projeto Supabase mudará, será necessário realizar um comando de "Find & Replace" na coluna `image_url` das tabelas para atualizar o prefixo do domínio para a nova conta.

**Status:** Infraestrutura entregue e estabilizada. 🚀