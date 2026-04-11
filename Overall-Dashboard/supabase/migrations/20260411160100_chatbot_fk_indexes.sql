-- ============================================================
-- chatbot.*  — covering indexes for foreign keys
-- Addresses performance advisor `unindexed_foreign_keys` lints.
-- ============================================================

create index if not exists chatbot_document_chunks_document_id_idx
  on chatbot.document_chunks (document_id);

create index if not exists chatbot_messages_conversation_id_idx
  on chatbot.messages (conversation_id);

create index if not exists chatbot_structured_datasets_document_id_idx
  on chatbot.structured_datasets (document_id);

create index if not exists chatbot_structured_rows_dataset_id_idx
  on chatbot.structured_rows (dataset_id);
