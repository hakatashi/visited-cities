import path from 'path';
import {fileURLToPath} from 'url';
import download from 'download';
import fs from 'fs-extra';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const prefs = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
const cities = [];

(async () => {
	for (const [i, pref] of prefs.entries()) {
		const res = await download(`https://www.land.mlit.go.jp/webland/api/CitySearch?area=${(i + 1).toString().padStart(2, '0')}`);
		const data = JSON.parse(res.toString());
		cities.push(...(data.data as {id: string, name: string}[]).map((city) => ({
			id: city.id,
			name: city.name,
			pref,
		})));
	}
	await fs.ensureDir(`${dirname}/../public/data`);
	await fs.writeJson(`${dirname}/../public/data/cities.json`, cities);

	await download(
		'https://github.com/smartnews-smri/japan-topography/raw/main/data/municipality/geojson/s0001/N03-21_210101.json',
		`${dirname}/../public/data`,
		{filename: 'cities.geojson'},
	);
})();
