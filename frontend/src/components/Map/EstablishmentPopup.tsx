import { useEstablishmentDetail } from "../../hooks/useEstablishments";

interface Props {
  id: number;
}

export default function EstablishmentPopup({ id }: Props) {
  const { data, loading } = useEstablishmentDetail(id);

  if (loading) return <div className="text-sm text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-sm text-red-500">Erro ao carregar dados.</div>;

  return (
    <div className="text-sm max-w-xs">
      <h3 className="font-bold text-base mb-1">{data.fantasy_name || data.name}</h3>
      <p className="text-gray-600 text-xs mb-2">{data.name}</p>

      <div className="flex flex-wrap gap-1 mb-2">
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
          {data.display_type}
        </span>
        {data.is_sus && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">SUS</span>
        )}
        {data.management_name && (
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
            {data.management_name}
          </span>
        )}
        {data.reference_categories?.map((cat) => (
          <span key={cat} className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
            {cat}
          </span>
        ))}
      </div>

      {data.address && <p className="text-gray-600 text-xs mb-1">{data.address}</p>}
      {data.phone && <p className="text-gray-600 text-xs mb-2">Tel: {data.phone}</p>}

      {data.beds && (data.beds.total_existing > 0) && (
        <div className="border-t pt-1 mb-2">
          <p className="font-semibold text-xs text-gray-700">Leitos</p>
          <p className="text-xs">Existentes: {data.beds.total_existing}</p>
          <p className="text-xs">SUS: {data.beds.total_sus}</p>
        </div>
      )}

      {data.equipments && data.equipments.length > 0 && (
        <div className="border-t pt-1 mb-2">
          <p className="font-semibold text-xs text-gray-700 mb-1">Equipamentos</p>
          <ul className="text-xs space-y-0.5">
            {data.equipments.slice(0, 5).map((eq) => (
              <li key={eq.code}>
                {eq.name}: {eq.quantity_existing} ({eq.quantity_in_use} em uso)
              </li>
            ))}
            {data.equipments.length > 5 && (
              <li className="text-gray-400">+{data.equipments.length - 5} mais...</li>
            )}
          </ul>
        </div>
      )}

      {data.services && data.services.length > 0 && (
        <div className="border-t pt-1">
          <p className="font-semibold text-xs text-gray-700 mb-1">Serviços Especializados</p>
          <ul className="text-xs space-y-0.5">
            {data.services.slice(0, 4).map((svc) => (
              <li key={svc.code}>{svc.name}</li>
            ))}
            {data.services.length > 4 && (
              <li className="text-gray-400">+{data.services.length - 4} mais...</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
