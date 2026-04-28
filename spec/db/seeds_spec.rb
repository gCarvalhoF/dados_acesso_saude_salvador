require "rails_helper"

RSpec.describe "db/seeds.rb" do
  # load_tasks registra callbacks nas rake tasks. Chamá-lo múltiplas vezes
  # duplicaria esses callbacks, fazendo cada importador ser invocado N vezes.
  # Por isso é chamado uma única vez antes de todos os exemplos.
  before(:all) do
    Rails.application.load_tasks
  end

  # Reabilita todas as tasks antes de cada exemplo, pois Rake marca tasks
  # como já executadas após o primeiro invoke e não as re-executa por padrão.
  before(:each) do
    Rake::Task.tasks.each(&:reenable)

    # seeds.rb chama Rails.application.load_tasks, o que re-registraria os
    # callbacks das rake tasks a cada 'load', multiplicando as invocações.
    # Já chamamos load_tasks em before(:all), então bloqueamos chamadas extras.
    allow(Rails.application).to receive(:load_tasks)

    allow(DataImport::NeighborhoodImporter).to receive(:call)
    allow(DataImport::IbgeCensusImporter).to receive(:call)
    allow(DataImport::CnesImporter).to receive(:call)
  end

  def run_seeds
    load Rails.root.join("db/seeds.rb")
  end

  it "executa sem erros" do
    expect { run_seeds }.not_to raise_error
  end

  it "invoca o importador de bairros" do
    expect(DataImport::NeighborhoodImporter).to receive(:call).once
    run_seeds
  end

  it "invoca o importador do censo" do
    expect(DataImport::IbgeCensusImporter).to receive(:call).once
    run_seeds
  end

  it "invoca o importador do CNES" do
    expect(DataImport::CnesImporter).to receive(:call).once
    run_seeds
  end

  it "executa os importadores na ordem correta (bairros -> censo -> CNES)" do
    order = []
    allow(DataImport::NeighborhoodImporter).to receive(:call) { order << :neighborhoods }
    allow(DataImport::IbgeCensusImporter).to receive(:call)       { order << :census }
    allow(DataImport::CnesImporter).to receive(:call)         { order << :cnes }

    run_seeds

    expect(order).to eq([ :neighborhoods, :census, :cnes ])
  end

  it "é idempotente: re-executar não levanta erro" do
    expect do
      run_seeds
      Rake::Task.tasks.each(&:reenable)
      run_seeds
    end.not_to raise_error
  end
end
