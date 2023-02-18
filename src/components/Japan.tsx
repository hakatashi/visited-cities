import merc from 'mercator-projection';
import {createMemo, Index} from 'solid-js';
import styles from './Japan.module.css';

interface Polygon {
	type: 'Polygon',
	coordinates: [number, number][][],
}

interface MultiPolygon {
	type: 'MultiPolygon',
	coordinates: [number, number][][][],
}

export interface Feature {
	type: 'Feature',
	geometry: Polygon | MultiPolygon,
	properties: {[id: string]: string},
  visited?: true,
}

export interface CitiesGeojson {
	type: 'FeatureCollection',
	features: Feature[],
}

interface PolygonsProps {
  polygon: Polygon | MultiPolygon,
  names: string[],
  visited: boolean,
}

const Polygons = (props: PolygonsProps) => {
	const polygons = createMemo(() => {
		if (props.polygon.type === 'Polygon') {
			return props.polygon.coordinates.map((polygon) => {
				const points = polygon.map(([lng, lat]) => {
					const {x, y} = merc.fromLatLngToPoint({lat, lng});
					return `${x},${y}`;
				}).join(' ');
				return points;
			});
		}

		return props.polygon.coordinates.flat().map((polygon) => {
			const points = polygon.map(([lng, lat]) => {
				const {x, y} = merc.fromLatLngToPoint({lat, lng});
				return `${x},${y}`;
			}).join(' ');
			return points;
		});
	});

	return (
		<g classList={{
			[styles.city]: true,
			[styles.visited]: props.visited,
		}}
		>
			<Index each={polygons()}>
				{(points) => (
					<polygon points={points()}/>
				)}
			</Index>
		</g>
	);
};

interface JapanProps {
  geojson: CitiesGeojson,
}

const Japan = (props: JapanProps) => (
	<svg viewBox="215 90 20 20">
		<Index each={props.geojson.features}>
			{(feature) => (
				<Polygons
					polygon={feature().geometry}
					names={Object.values(feature().properties)}
					visited={feature().visited ?? false}
				/>
			)}
		</Index>
	</svg>
);

export default Japan;

