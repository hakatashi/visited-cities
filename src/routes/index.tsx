import dayjs from 'dayjs';
import {EventIterator} from 'event-iterator';
import JSZip from 'jszip';
import type {JSX} from 'solid-js';
import cities from '../data/cities';

const citiesRegex = new RegExp(`(?<city>${cities.map((city) => city.pref + city.name).join('|')})`, '');

const Home = () => {
	const reader = new FileReader();

	const loadZip = async () => {
		if (!(reader.result instanceof ArrayBuffer)) {
			return;
		}

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
		const cityHistories: {city: string, date: string}[] = [];

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
								date: dayjs(event?.placeVisit?.duration?.startTimestamp ?? '').format('YYYY/MM/DD'),
							});
						}
					}
				}
			}
		}

		console.log(cityHistories);
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
			<input
				type="file"
				accept="application/zip"
				onChange={handleImageChange}
			/>
		</main>
	);
};

export default Home;
