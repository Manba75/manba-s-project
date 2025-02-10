import axios from "axios";
import db from "../config/db.js"; // Ensure db connection is imported

 async function getCoordinates(address, id) {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: { q: address, format: "json", limit: 1 },
        headers: { "User-Agent": "YourApp/1.0" },
      }
    );

    if (response.data.length > 0) {
      const location = response.data[0];
      const latt = parseFloat(location.lat);
      const long = parseFloat(location.lon);
      console.log(`Lat: ${latt}, Long: ${long}, ID: ${id}`);

      // Update coordinates in the address table
      await db.query(
        "UPDATE address SET address_latitude=$1, address_longitude=$2 WHERE id=$3",
        [latt, long, id]
      );
  
      // Return the coordinates
      return { lat: latt, lng: long };
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
  }
  return null;
}


export const savedAddress = async (address, addressID) => {
  const coords = await getCoordinates(address, addressID);

  console.log("Address updated successfully...",coords);
 
};
