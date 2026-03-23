#pragma once

#include "CoreMinimal.h"

class UObject;
class FJsonObject;
class FJsonValue;

namespace McpAssetInspectionUtils
{
struct FInspectOptions
{
    int32 MaxDepth = 3;
    bool bIncludeTransient = false;
    bool bIncludeDefaults = false;
    FString PropertyFilter;
    FString CategoryFilter;
};

MCPAUTOMATIONBRIDGE_API UObject* ResolveAssetObject(const FString& AssetPath, FString& OutResolvedPath, FString& OutError);

MCPAUTOMATIONBRIDGE_API TSharedPtr<FJsonObject> BuildAssetInspectionJson(
    UObject* Asset,
    const FString& ResolvedPath,
    const FInspectOptions& Options);

MCPAUTOMATIONBRIDGE_API FString ClassifyAssetType(UObject* Asset);
}
