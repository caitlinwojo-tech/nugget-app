/* nugget backend config.
   The publishable key is designed to be public in a web app — the database is
   protected by row-level security (anyone may read foods and add foods; nobody
   can tamper with or delete rows). This is NOT a secret key. */
window.NUGGET_CONFIG = {
  supabaseUrl: "https://uwkznunwqpbxhegogtqc.supabase.co",
  supabaseKey: "sb_publishable_yw9X8-hlig8fPUZPwQvLzg_QkhkJ_OH"
};
