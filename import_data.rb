require 'pg'
require 'csv'
require 'date'

db_config = {
  host: 'localhost',
  port: 5432,
  dbname: 'tech_playground',
  user: 'user',
  password: 'password'
}

begin
  conn = PG.connect(db_config)
  puts "Connected to PostgreSQL database."

  def escape(conn, str)
    return 'NULL' if str.nil? || str.strip.empty? || str == '-'
    "'#{conn.escape_string(str.strip)}'"
  end

  def parse_int(str)
    return 'NULL' if str.nil? || str.strip.empty? || str == '-'
    str.to_i
  end

  def parse_date(conn, str)
    return 'NULL' if str.nil? || str.strip.empty? || str == '-'
    begin
      date = Date.strptime(str, '%d/%m/%Y')
      "'#{date.to_s}'"
    rescue Date::Error
      'NULL'
    end
  end

  csv_path = File.join(__dir__, 'data.csv')
  
  puts "Starting import from #{csv_path}..."
  
  count = 0
  
  CSV.foreach(csv_path, headers: true, col_sep: ';') do |row|
    n0 = escape(conn, row['n0_empresa'])
    n1 = escape(conn, row['n1_diretoria'])
    n2 = escape(conn, row['n2_gerencia'])
    n3 = escape(conn, row['n3_coordenacao'])
    n4 = escape(conn, row['n4_area'])

    res = conn.exec("SELECT id FROM areas WHERE n0_empresa IS NOT DISTINCT FROM #{n0} AND n1_diretoria IS NOT DISTINCT FROM #{n1} AND n2_gerencia IS NOT DISTINCT FROM #{n2} AND n3_coordenacao IS NOT DISTINCT FROM #{n3} AND n4_area IS NOT DISTINCT FROM #{n4}")
    
    area_id = if res.num_tuples > 0
                res[0]['id']
              else
                conn.exec("INSERT INTO areas (n0_empresa, n1_diretoria, n2_gerencia, n3_coordenacao, n4_area) VALUES (#{n0}, #{n1}, #{n2}, #{n3}, #{n4}) RETURNING id")[0]['id']
              end

    email = escape(conn, row['email'])
    
    res = conn.exec("SELECT id FROM employees WHERE email = #{email}")
    
    employee_id = if res.num_tuples > 0
                    res[0]['id']
                  else
                    nome = escape(conn, row['nome'])
                    email_corp = escape(conn, row['email_corporativo'])
                    celular = escape(conn, row['celular'])
                    cargo = escape(conn, row['cargo'])
                    funcao = escape(conn, row['funcao'])
                    localidade = escape(conn, row['localidade'])
                    tempo = escape(conn, row['tempo_de_empresa'])
                    genero = escape(conn, row['genero'])
                    geracao = escape(conn, row['geracao'])
                    
                    conn.exec("INSERT INTO employees (area_id, nome, email, email_corporativo, celular, cargo, funcao, localidade, tempo_de_empresa, genero, geracao) VALUES (#{area_id}, #{nome}, #{email}, #{email_corp}, #{celular}, #{cargo}, #{funcao}, #{localidade}, #{tempo}, #{genero}, #{geracao}) RETURNING id")[0]['id']
                  end

    data_resposta = parse_date(conn, row['Data da Resposta'])
    
    interesse = parse_int(row['Interesse no Cargo'])
    com_interesse = escape(conn, row['Comentários - Interesse no Cargo'])
    
    contribuicao = parse_int(row['Contribuição'])
    com_contribuicao = escape(conn, row['Comentários - Contribuição'])
    
    aprendizado = parse_int(row['Aprendizado e Desenvolvimento'])
    com_aprendizado = escape(conn, row['Comentários - Aprendizado e Desenvolvimento'])
    
    feedback = parse_int(row['Feedback'])
    com_feedback = escape(conn, row['Comentários - Feedback'])
    
    interacao = parse_int(row['Interação com Gestor'])
    com_interacao = escape(conn, row['Comentários - Interação com Gestor'])
    
    clareza = parse_int(row['Clareza sobre Possibilidades de Carreira'])
    com_clareza = escape(conn, row['Comentários - Clareza sobre Possibilidades de Carreira'])
    
    expectativa = parse_int(row['Expectativa de Permanência'])
    com_expectativa = escape(conn, row['Comentários - Expectativa de Permanência'])
    
    enps = parse_int(row['eNPS'])
    com_enps = escape(conn, row['[Aberta] eNPS'])

    conn.exec("INSERT INTO surveys (employee_id, data_resposta, interesse_no_cargo, comentarios_interesse, contribuicao, comentarios_contribuicao, aprendizado, comentarios_aprendizado, feedback, comentarios_feedback, interacao_gestor, comentarios_interacao, clareza_carreira, comentarios_clareza, expectativa_permanencia, comentarios_expectativa, enps, enps_comentario) VALUES (#{employee_id}, #{data_resposta}, #{interesse}, #{com_interesse}, #{contribuicao}, #{com_contribuicao}, #{aprendizado}, #{com_aprendizado}, #{feedback}, #{com_feedback}, #{interacao}, #{com_interacao}, #{clareza}, #{com_clareza}, #{expectativa}, #{com_expectativa}, #{enps}, #{com_enps})")

    count += 1
    print "." if count % 10 == 0
  end
  
  puts "\nImport completed successfully! Processed #{count} rows."

rescue PG::Error => e
  puts "Database Error: #{e.message}"
rescue StandardError => e
  puts "Error: #{e.message}"
  puts e.backtrace
ensure
  conn&.close
end
