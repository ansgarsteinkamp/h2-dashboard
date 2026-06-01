import { GeoJSON, Pane } from "react-leaflet";

import { COUNTRY_STYLES } from "@/components/map/mapTheme";

export default function CountryLayers({ europeContext, germany }) {
   return (
      <Pane name="countries" style={{ zIndex: 300 }}>
         <GeoJSON data={europeContext} interactive={false} style={COUNTRY_STYLES.context} />
         <GeoJSON data={germany} interactive={false} style={COUNTRY_STYLES.germany} />
      </Pane>
   );
}
