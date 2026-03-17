Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :neighborhoods, only: [ :index, :show ]
      resources :health_establishments, only: [ :index, :show ]

      namespace :dashboard do
        get :overview
        get :equipment_by_neighborhood
        get :service_summary
      end
    end
  end
end
