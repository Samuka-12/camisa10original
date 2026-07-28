const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmpraHloaGpwa3d6ZnJjdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODgyNDcsImV4cCI6MjA5MjA2NDI0N30.AObuo3zHyMe_ffM78FOWIiUcDrU8W3JyvZMa5h-rBCs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const CONFIG_UUID = '00000000-0000-0000-0000-000000000000';

async function testUpdate() {
  console.log("--- TESTANDO UPDATE NA LINHA STORE_CONFIG ---");
  const testPayload = {
    test_update_persisted: true,
    updated_at: new Date().toISOString()
  };

  const { data: updateData, error: updateError } = await supabase
    .from('produtos')
    .update({
      description: JSON.stringify(testPayload)
    })
    .eq('id', CONFIG_UUID)
    .select();

  console.log("Update Data:", updateData);
  console.log("Update Error:", updateError);

  console.log("\n--- VERIFICANDO LEITURA APÓS UPDATE ---");
  const { data: readData, error: readError } = await supabase
    .from('produtos')
    .select('description')
    .eq('id', CONFIG_UUID);

  console.log("Read Data after update:", readData);
  console.log("Read Error after update:", readError);
}

testUpdate();
