import * as vscode from 'vscode';

interface IWeatherParameters {
	city: string;
}

interface GeocodingResponse {
	results?: Array<{
		name: string;
		latitude: number;
		longitude: number;
		country: string;
		admin1?: string;
	}>;
}

interface WeatherResponse {
	current: {
		temperature_2m: number;
		relative_humidity_2m: number;
		wind_speed_10m: number;
		weather_code: number;
	};
}

export class WeatherTool implements vscode.LanguageModelTool<IWeatherParameters> {
	private getWeatherDescription(weatherCode: number): string {
		// WMO Weather interpretation codes
		const weatherCodes: Record<number, string> = {
			0: 'clear sky',
			1: 'mainly clear',
			2: 'partly cloudy',
			3: 'overcast',
			45: 'fog',
			48: 'depositing rime fog',
			51: 'light drizzle',
			53: 'moderate drizzle',
			55: 'dense drizzle',
			61: 'slight rain',
			63: 'moderate rain',
			65: 'heavy rain',
			71: 'slight snow fall',
			73: 'moderate snow fall',
			75: 'heavy snow fall',
			80: 'slight rain showers',
			81: 'moderate rain showers',
			82: 'violent rain showers',
			95: 'thunderstorm',
			96: 'thunderstorm with slight hail',
			99: 'thunderstorm with heavy hail',
		};
		return weatherCodes[weatherCode] || 'unknown';
	}

	private async fetchGeocodingData(
		city: string
	): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
		try {
			const encodedCity = encodeURIComponent(city);
			const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedCity}&count=1&language=en&format=json`;

			const response = await fetch(geocodingUrl);
			if (!response.ok) {
				throw new Error(`Geocoding API error: ${response.status}`);
			}

			const data = (await response.json()) as GeocodingResponse;

			if (!data.results || data.results.length === 0) {
				return null;
			}

			const result = data.results[0];
			const displayName = result.admin1
				? `${result.name}, ${result.admin1}, ${result.country}`
				: `${result.name}, ${result.country}`;

			return {
				latitude: result.latitude,
				longitude: result.longitude,
				displayName,
			};
		} catch (error) {
			console.error('Geocoding error:', error);
			return null;
		}
	}

	private async fetchWeatherData(
		latitude: number,
		longitude: number
	): Promise<WeatherResponse | null> {
		try {
			const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;

			const response = await fetch(weatherUrl);
			if (!response.ok) {
				throw new Error(`Weather API error: ${response.status}`);
			}

			const data = (await response.json()) as WeatherResponse;
			return data;
		} catch (error) {
			console.error('Weather API error:', error);
			return null;
		}
	}

	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<IWeatherParameters>,
		_token: vscode.CancellationToken
	) {
		const params = options.input;
		const city = params.city.trim();

		try {
			// Get coordinates for the city
			const geoData = await this.fetchGeocodingData(city);
			if (!geoData) {
				return new vscode.LanguageModelToolResult([
					new vscode.LanguageModelTextPart(
						JSON.stringify(
							{
								error: `City "${city}" not found. Please check the city name and try again.`,
								city: city,
							},
							null,
							2
						)
					),
				]);
			}

			// Get weather data using coordinates
			const weatherData = await this.fetchWeatherData(
				geoData.latitude,
				geoData.longitude
			);
			if (!weatherData) {
				return new vscode.LanguageModelToolResult([
					new vscode.LanguageModelTextPart(
						JSON.stringify(
							{
								error: `Unable to fetch weather data for ${geoData.displayName}. Please try again later.`,
								city: geoData.displayName,
							},
							null,
							2
						)
					),
				]);
			}

			const current = weatherData.current;
			const condition = this.getWeatherDescription(current.weather_code);

			// Return comprehensive weather information
			const weatherReport = {
				city: geoData.displayName,
				coordinates: {
					latitude: geoData.latitude,
					longitude: geoData.longitude,
				},
				temperature: `${Math.round(current.temperature_2m)}°C`,
				condition: condition,
				humidity: `${current.relative_humidity_2m}%`,
				windSpeed: `${Math.round(current.wind_speed_10m)} km/h`,
				weatherCode: current.weather_code,
				summary: `${geoData.displayName} is currently ${Math.round(
					current.temperature_2m
				)}°C with ${condition} conditions. Humidity is at ${
					current.relative_humidity_2m
				}% and wind speed is ${Math.round(current.wind_speed_10m)} km/h.`,
				dataSource: 'Open-Meteo API',
			};

			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(JSON.stringify(weatherReport, null, 2)),
			]);
		} catch (error) {
			console.error('Weather tool error:', error);
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(
					JSON.stringify(
						{
							error: `An error occurred while fetching weather data: ${
								error instanceof Error ? error.message : 'Unknown error'
							}`,
							city: city,
						},
						null,
						2
					)
				),
			]);
		}
	}

	async prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<IWeatherParameters>,
		_token: vscode.CancellationToken
	) {
		const confirmationMessages = {
			title: 'Get Weather Information',
			message: new vscode.MarkdownString(
				`Get current weather information for **${options.input.city}** using Open-Meteo API?`
			),
		};
		return {
			invocationMessage: `Getting weather data for ${options.input.city} from Open-Meteo...`,
			confirmationMessages,
		};
	}
}

export function registerWeatherTools(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.lm.registerTool('weather-tool_getWeather', new WeatherTool())
	);
}

export function activate(context: vscode.ExtensionContext) {
	registerWeatherTools(context);
}

export function deactivate() {}
