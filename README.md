# Weather Tool Sample

A VS Code extension that demonstrates how to create a **language model tool** that integrates seamlessly with Copilot Chat.

## What it does

This extension creates a `weather` tool that Copilot can invoke directly to get weather information for any city.

## How it Works

1. **User asks Copilot**: "What's the weather in Paris?"
2. **Copilot invokes tool**: Uses the `weather-tool_getWeather` tool with city parameter
3. **Tool returns data**: Structured weather information (temperature, conditions, humidity, wind)
4. **Copilot responds**: Natural language response with the weather data
5. **Follow-ups work**: "What's the temperature?" - Copilot has the context!

## Example Usage

```
User: What's the weather in Paris?
Copilot: I'll get the current weather information for Paris.
[Tool confirmation dialog appears]
Copilot: Based on the weather data, Paris is currently 25°C with cloudy conditions...

User: What's the humidity?
Copilot: The humidity in Paris is 70%.
```

## Key Features

- **Direct Copilot Integration**: Tool responses become part of Copilot's conversation context
- **User Confirmation**: Shows confirmation dialog before fetching weather data
- **Comprehensive Data**: Temperature, conditions, humidity, and wind speed
- **Multiple Cities**: Supports various city formats (London, NYC, New York, etc.)
- **Reference Support**: Can be referenced with `#weather` in prompts

## Technical Implementation

### Tool Registration

```typescript
export function registerWeatherTools(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.lm.registerTool("weather-tool_getWeather", new WeatherTool())
  );
}
```

### Tool Configuration (package.json)

```json
"languageModelTools": [
    {
        "name": "weather-tool_getWeather",
        "toolReferenceName": "weather",
        "displayName": "Weather Tool",
        "modelDescription": "Get current weather information for a specified city",
        "canBeReferencedInPrompt": true,
        "icon": "$(cloud)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "The name of the city to get weather information for"
                }
            },
            "required": ["city"]
        }
    }
]
```

## Running it by yourself

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Open in VS Code and press F5 to run
```

## Testing

1. Run the extension (F5)
2. Ask Copilot: "What's the weather in London?"
3. Confirm the tool invocation
4. Try follow-up questions: "What's the temperature?" or "Is it sunny?"

## Real Weather API

To use a real weather API, replace the mock `weatherData` object in `WeatherTool.invoke()` with actual API calls.
