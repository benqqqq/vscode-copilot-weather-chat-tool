import * as vscode from 'vscode';

interface IWeatherParameters {
	city: string;
}

export class WeatherTool implements vscode.LanguageModelTool<IWeatherParameters> {
	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<IWeatherParameters>,
		_token: vscode.CancellationToken
	) {
		const params = options.input;
		const city = params.city.toLowerCase();

		// Mock weather data (in real implementation, you'd call a weather API)
		const weatherData: Record<
			string,
			{ temp: number; condition: string; humidity: number; windSpeed: number }
		> = {
			london: { temp: 30, condition: 'sunny', humidity: 65, windSpeed: 12 },
			paris: { temp: 25, condition: 'cloudy', humidity: 70, windSpeed: 8 },
			tokyo: { temp: 28, condition: 'rainy', humidity: 85, windSpeed: 15 },
			'new york': {
				temp: 22,
				condition: 'partly cloudy',
				humidity: 60,
				windSpeed: 10,
			},
			newyork: { temp: 22, condition: 'partly cloudy', humidity: 60, windSpeed: 10 },
			nyc: { temp: 22, condition: 'partly cloudy', humidity: 60, windSpeed: 10 },
		};

		// Get weather data or use default
		const weather = weatherData[city] || {
			temp: 20,
			condition: 'mild',
			humidity: 55,
			windSpeed: 5,
		};

		// Format the city name properly for display
		const displayCity = city.charAt(0).toUpperCase() + city.slice(1);

		// Return comprehensive weather information
		const weatherReport = {
			city: displayCity,
			temperature: `${weather.temp}°C`,
			condition: weather.condition,
			humidity: `${weather.humidity}%`,
			windSpeed: `${weather.windSpeed} km/h`,
			summary: `${displayCity} is currently ${weather.temp}°C with ${weather.condition} conditions. Humidity is at ${weather.humidity}% and wind speed is ${weather.windSpeed} km/h.`,
		};

		return new vscode.LanguageModelToolResult([
			new vscode.LanguageModelTextPart(JSON.stringify(weatherReport, null, 2)),
		]);
	}

	async prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<IWeatherParameters>,
		_token: vscode.CancellationToken
	) {
		const confirmationMessages = {
			title: 'Get Weather Information',
			message: new vscode.MarkdownString(
				`Get current weather information for **${options.input.city}**?`
			),
		};
		return {
			invocationMessage: `Getting weather data for ${options.input.city}...`,
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
