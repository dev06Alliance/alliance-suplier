using System.Collections.Concurrent;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace AllianceSupplier.Service;

// Singleton — keyed by userId, last-write-wins on reconnect
public class SseManager
{
    private readonly ConcurrentDictionary<Guid, HttpResponse> _connections = new();

    public void AddConnection(Guid userId, HttpResponse response) =>
        _connections[userId] = response;

    public void RemoveConnection(Guid userId) =>
        _connections.TryRemove(userId, out _);

    public async Task SendToUserAsync(Guid userId, string data)
    {
        if (!_connections.TryGetValue(userId, out var response))
            return;

        try
        {
            var bytes = Encoding.UTF8.GetBytes($"data: {data}\n\n");
            await response.Body.WriteAsync(bytes);
            await response.Body.FlushAsync();
        }
        catch
        {
            // Client disconnected — remove stale connection
            _connections.TryRemove(userId, out _);
        }
    }
}
