class Services::Cidacs::Api
  include HTTParty
  base_uri ENV.fetch("CIDACS_API_BASE_URL", "http://35.209.112.76:3000")

  def initialize(api_key: ENV.fetch("CIDACS_API_KEY", nil))
    @headers = {
      "Authorization" => "Bearer #{api_key}",
      "Content-Type" => "application/json"
    }
  end

  def get_data(endpoint)
    response = self.class.get(endpoint, headers: @headers)
    handle_response(response)
  end

  private
  
  def handle_response(response)
    case response.code
    when 200
      JSON.parse(response.body)
    when 401
      raise "Unauthorized: Invalid API key"
    when 404
      raise "Not Found: The requested resource could not be found"
    else
      raise "Error: Received HTTP #{response.code}"
    end
  end
end