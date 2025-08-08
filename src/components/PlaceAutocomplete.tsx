import { useRef } from "react";
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input.tsx";

const libraries = ["places"];

interface Props {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
}

export const PlaceAutocomplete = ({
  onPlaceSelected,
  placeholder = "Search city or place...",
}: Props) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      onPlaceSelected(place);
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries as any}
    >
      <Autocomplete onLoad={handleLoad} onPlaceChanged={handlePlaceChanged}>
        <Input placeholder={placeholder} />
      </Autocomplete>
    </LoadScript>
  );
};
