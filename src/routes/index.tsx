import dayjs from 'dayjs';
import {EventIterator} from 'event-iterator';
import JSZip from 'jszip';
import {createSignal, For, JSX, onMount, Show} from 'solid-js';
import type {CitiesGeojson, Feature} from '~/components/Japan';
import Japan from '~/components/Japan';

interface CityVisit {
	city: string,
	cityId: string | undefined,
	date: string,
}

const Home = () => {
	const reader = new FileReader();

	const [citiesGeojson, setCitiesGeojson] = createSignal<CitiesGeojson | null>(null);
	const [cityVisits, setCityVisits] = createSignal<{city: string, cityId: string, date: string}[]>([]);

	onMount(async () => {
		const data: CitiesGeojson = await fetch('/data/cities.geojson').then((data) => data.json());
		setCitiesGeojson(data);
	});

	const loadZip = async () => {
		if (!(reader.result instanceof ArrayBuffer)) {
			return;
		}

		const cities = await fetch('/data/cities.json').then((data) => data.json());
		const cityIds = new Map<string, string>(cities.map((city) => [city.pref + city.name, city.id]));
		const citiesRegex = new RegExp(`(?<city>${cities.map((city) => city.pref + city.name).join('|')})`, '');

		const zip = await JSZip.loadAsync(reader.result);
		const iterator = new EventIterator<JSZip.JSZipObject>(({push, stop}) => {
			zip.forEach((relativePath, file) => {
				if (relativePath.includes('Semantic Location History') && relativePath.endsWith('.json')) {
					push(file);
				}
			});
			stop();
		});

		const citiesSet = new Set<string>();
		const cityHistories: CityVisit[] = [];

		for await (const file of iterator) {
			const data = await file.async('string');
			const parsedData = JSON.parse(data);
			const events = parsedData?.timelineObjects ?? [];

			for (const event of events) {
				if ({}.hasOwnProperty.call(event, 'placeVisit')) {
					const address: string = event.placeVisit?.location?.address ?? '';
					const match = citiesRegex.exec(address);
					if (match) {
						const city: string = match?.groups?.city ?? '';
						if (!citiesSet.has(city)) {
							citiesSet.add(city);
							cityHistories.push({
								city,
								cityId: cityIds.get(city),
								date: dayjs(event?.placeVisit?.duration?.startTimestamp ?? '').format('YYYY/MM/DD'),
							} as CityVisit);
						}
					}
				}
			}
		}

		setCityVisits(cityHistories);

		const visitedCityIds = new Set<string>();
		for (const {city} of cityHistories) {
			if (cityIds.has(city)) {
				visitedCityIds.add(cityIds.get(city)!);
			}
		}

		const newFeatures = citiesGeojson()!.features.map((feature) => {
			const names = Object.values(feature.properties);
			const cityId = names.find((name) => name?.match(/^\d+$/));
			if (!cityId) {
				return feature;
			}

			const visited = visitedCityIds.has(cityId) || visitedCityIds.has(`${cityId.slice(0, 3)}00`);
			if (!visitedCityIds.has(cityId) && visitedCityIds.has(`${cityId.slice(0, 3)}00`)) {
				console.log(names);
			}

			if (visited) {
				return {
					...feature,
					visited: true,
				} as Feature;
			}
			return feature;
		});

		setCitiesGeojson({
			type: 'FeatureCollection',
			features: newFeatures,
		});
	};

	const handleImageChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
		const file = event.currentTarget.files?.[0];
		if (file) {
			reader.onload = loadZip;
			reader.readAsArrayBuffer(file);
		}
	};

	return (
		<main>
			<Show when={citiesGeojson()}>
				<Japan geojson={citiesGeojson()}/>
			</Show>
			<input
				type="file"
				accept="application/zip"
				onChange={handleImageChange}
			/>
			<For each={cityVisits()}>
				{(cityVisit) => (
					<p>{cityVisit.city} ({cityVisit.cityId}): {cityVisit.date}</p>
				 )}
			</For>
		</main>
	);
};

export default Home;
