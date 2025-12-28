require_relative '../import_data'

RSpec.describe DataImporter do
  let(:db_config) do
    {
      host: 'localhost',
      port: 5432,
      dbname: 'tech_playground_test',
      user: 'user',
      password: 'password'
    }
  end
  
  let(:importer) { DataImporter.new(db_config) }
  let(:mock_conn) { double('PG::Connection') }

  before do
    allow(PG).to receive(:connect).and_return(mock_conn)
    allow(mock_conn).to receive(:escape_string) { |str| str }
  end

  describe '#parse_int' do
    it 'returns NULL for nil values' do
      expect(importer.parse_int(nil)).to eq('NULL')
    end

    it 'returns NULL for empty strings' do
      expect(importer.parse_int('')).to eq('NULL')
      expect(importer.parse_int('   ')).to eq('NULL')
    end

    it 'returns NULL for dash character' do
      expect(importer.parse_int('-')).to eq('NULL')
    end

    it 'parses valid integer strings' do
      expect(importer.parse_int('5')).to eq(5)
      expect(importer.parse_int('10')).to eq(10)
      expect(importer.parse_int('0')).to eq(0)
    end
  end

  describe '#parse_date' do
    before do
      importer.connect
    end

    it 'returns NULL for nil values' do
      expect(importer.parse_date(nil)).to eq('NULL')
    end

    it 'returns NULL for empty strings' do
      expect(importer.parse_date('')).to eq('NULL')
    end

    it 'returns NULL for dash character' do
      expect(importer.parse_date('-')).to eq('NULL')
    end

    it 'parses valid dates in DD/MM/YYYY format' do
      expect(importer.parse_date('20/01/2022')).to eq("'2022-01-20'")
      expect(importer.parse_date('01/12/2023')).to eq("'2023-12-01'")
    end

    it 'returns NULL for invalid date formats' do
      expect(importer.parse_date('invalid')).to eq('NULL')
      expect(importer.parse_date('2022-01-20')).to eq('NULL')
    end
  end

  describe '#escape' do
    before do
      importer.connect
    end

    it 'returns NULL for nil values' do
      expect(importer.escape(nil)).to eq('NULL')
    end

    it 'returns NULL for empty strings' do
      expect(importer.escape('')).to eq('NULL')
    end

    it 'returns NULL for dash character' do
      expect(importer.escape('-')).to eq('NULL')
    end

    it 'escapes and quotes valid strings' do
      expect(importer.escape('test')).to eq("'test'")
      expect(importer.escape('  test  ')).to eq("'test'")
    end
  end

  describe '#import_row' do
    let(:sample_row) do
      {
        'n0_empresa' => 'empresa',
        'n1_diretoria' => 'diretoria a',
        'n2_gerencia' => 'gerência a1',
        'n3_coordenacao' => 'coordenação a11',
        'n4_area' => 'área a112',
        'nome' => 'Demo 001',
        'email' => 'demo001@pinpeople.com.br',
        'email_corporativo' => 'demo001@pinpeople.com.br',
        'celular' => nil,
        'cargo' => 'estagiário',
        'funcao' => 'profissional',
        'localidade' => 'brasília',
        'tempo_de_empresa' => 'entre 1 e 2 anos',
        'genero' => 'masculino',
        'geracao' => 'geração z',
        'Data da Resposta' => '20/01/2022',
        'Interesse no Cargo' => '7',
        'Comentários - Interesse no Cargo' => '-',
        'Contribuição' => '1',
        'Comentários - Contribuição' => '-',
        'Aprendizado e Desenvolvimento' => '1',
        'Comentários - Aprendizado e Desenvolvimento' => '-',
        'Feedback' => '6',
        'Comentários - Feedback' => '-',
        'Interação com Gestor' => '6',
        'Comentários - Interação com Gestor' => '-',
        'Clareza sobre Possibilidades de Carreira' => '6',
        'Comentários - Clareza sobre Possibilidades de Carreira' => '-',
        'Expectativa de Permanência' => '2',
        'Comentários - Expectativa de Permanência' => '-',
        'eNPS' => '5',
        '[Aberta] eNPS' => 'A empresa tem um excelente ambiente de trabalho.'
      }
    end

    before do
      importer.connect
      
      # Mock area lookup and insert
      area_result = double('PG::Result', num_tuples: 0)
      area_insert_result = [{ 'id' => '1' }]
      
      # Mock employee lookup and insert
      employee_result = double('PG::Result', num_tuples: 0)
      employee_insert_result = [{ 'id' => '1' }]
      
      allow(mock_conn).to receive(:exec).with(/SELECT id FROM areas/).and_return(area_result)
      allow(mock_conn).to receive(:exec).with(/INSERT INTO areas/).and_return(area_insert_result)
      allow(mock_conn).to receive(:exec).with(/SELECT id FROM employees/).and_return(employee_result)
      allow(mock_conn).to receive(:exec).with(/INSERT INTO employees/).and_return(employee_insert_result)
      allow(mock_conn).to receive(:exec).with(/INSERT INTO surveys/).and_return(nil)
    end

    it 'imports a row successfully' do
      expect { importer.import_row(sample_row) }.not_to raise_error
    end

    it 'creates area if not exists' do
      expect(mock_conn).to receive(:exec).with(/INSERT INTO areas/)
      importer.import_row(sample_row)
    end

    it 'creates employee if not exists' do
      expect(mock_conn).to receive(:exec).with(/INSERT INTO employees/)
      importer.import_row(sample_row)
    end

    it 'creates survey record' do
      expect(mock_conn).to receive(:exec).with(/INSERT INTO surveys/)
      importer.import_row(sample_row)
    end
  end
end
