import { useMyCharacter } from "@/hooks/useCharacter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { explorerUrl } from "@/lib/explorer";

export function MyCharacter() {
  const { character, isLoading, error } = useMyCharacter();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-300 text-lg font-medium text-center">
            In-Game Character
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-400">Loading character...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-300 text-lg font-medium text-center">
            My Character
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-400">Error loading character</p>
            <p className="text-sm text-slate-500 mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!character) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-slate-300 text-lg font-medium text-center">
            In-Game Character
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-400">No character found</p>
            <p className="text-sm text-slate-500 mt-2">Create a character to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-slate-300 text-lg font-medium text-center">
          In-Game Character
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {character.metadata.url && (
            <div className="flex justify-center">
              <img
                src={character.metadata.url}
                alt={character.metadata.name}
                className="h-32 w-32 rounded-lg object-cover border-2 border-slate-700"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {character.metadata.name}
              </h3>
              {character.metadata.description && (
                <p className="text-sm text-slate-400 mt-1">
                  {character.metadata.description}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                <span className="text-slate-400">Tribe ID</span>
                <span className="text-slate-300 font-mono">{character.tribe_id}</span>
              </div>

              <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                <span className="text-slate-400">Character ID</span>
                <a
                  href={explorerUrl({ type: "object", id: character.id })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-xs"
                >
                  {character.id.slice(0, 6)}...{character.id.slice(-4)}
                </a>
              </div>

            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
