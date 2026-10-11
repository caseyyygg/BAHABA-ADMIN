export function containsPoint(geometry, longitude, latitude) {
  const ringContains = (ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x,y] = ring[i], [a,b] = ring[j];
      const cross = (longitude-x)*(b-y)-(latitude-y)*(a-x);
      if (Math.abs(cross)<1e-10 && longitude>=Math.min(x,a) && longitude<=Math.max(x,a) && latitude>=Math.min(y,b) && latitude<=Math.max(y,b)) return true;
      if ((y>latitude)!==(b>latitude) && longitude<(a-x)*(latitude-y)/(b-y)+x) inside = !inside;
    }
    return inside;
  };
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : geometry.type === 'Polygon' ? [geometry.coordinates] : [];
  return polygons.some(rings => ringContains(rings[0]) && !rings.slice(1).some(ringContains));
}
