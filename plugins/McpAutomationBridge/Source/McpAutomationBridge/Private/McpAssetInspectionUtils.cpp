#include "McpAssetInspectionUtils.h"

#include "McpHandlerUtils.h"
#include "McpPropertyReflection.h"

#include "Dom/JsonObject.h"
#include "Engine/Blueprint.h"
#include "Engine/DataAsset.h"
#include "Engine/DataTable.h"
#include "Materials/Material.h"
#include "Materials/MaterialInstance.h"
#include "Misc/PackageName.h"
#include "UObject/Package.h"

namespace McpAssetInspectionUtils
{
UObject* ResolveAssetObject(const FString& AssetPath, FString& OutResolvedPath, FString& OutError)
{
    OutResolvedPath.Empty();
    OutError.Empty();

    if (AssetPath.IsEmpty())
    {
        OutError = TEXT("assetPath is empty");
        return nullptr;
    }

    UObject* Asset = McpHandlerUtils::ResolveObjectFromPath(AssetPath, &OutResolvedPath);
    if (!Asset)
    {
        OutError = FString::Printf(TEXT("Asset not found: %s"), *AssetPath);
        return nullptr;
    }

    if (Cast<UPackage>(Asset))
    {
        UObject* NestedAsset = FindObject<UObject>(Asset, *FPackageName::GetLongPackageAssetName(Asset->GetPathName()));
        if (NestedAsset)
        {
            Asset = NestedAsset;
            OutResolvedPath = Asset->GetPathName();
        }
    }

    return Asset;
}

FString ClassifyAssetType(UObject* Asset)
{
    if (!Asset)
    {
        return TEXT("Unknown");
    }

    if (Asset->IsA<UDataAsset>())
    {
        return TEXT("DataAsset");
    }
    if (Asset->IsA<UDataTable>())
    {
        return TEXT("DataTable");
    }
    if (Asset->IsA<UBlueprint>())
    {
        return TEXT("Blueprint");
    }
    if (Asset->IsA<UMaterialInstance>())
    {
        return TEXT("MaterialInstance");
    }
    if (Asset->IsA<UMaterial>())
    {
        return TEXT("Material");
    }

    return Asset->GetClass()->GetName();
}

TSharedPtr<FJsonObject> BuildAssetInspectionJson(
    UObject* Asset,
    const FString& ResolvedPath,
    const FInspectOptions& Options)
{
    if (!Asset)
    {
        return nullptr;
    }

    TSharedPtr<FJsonObject> Result = MakeShared<FJsonObject>();
    Result->SetBoolField(TEXT("success"), true);
    Result->SetStringField(TEXT("assetPath"), ResolvedPath.IsEmpty() ? Asset->GetPathName() : ResolvedPath);
    Result->SetStringField(TEXT("assetName"), Asset->GetName());
    Result->SetStringField(TEXT("assetClass"), Asset->GetClass()->GetName());
    Result->SetStringField(TEXT("assetClassPath"), Asset->GetClass()->GetPathName());
    Result->SetStringField(TEXT("assetType"), ClassifyAssetType(Asset));

    McpPropertyReflection::FExportOptions ExportOptions;
    ExportOptions.bIncludeTransient = Options.bIncludeTransient;
    ExportOptions.bIncludeDefaults = Options.bIncludeDefaults;
    ExportOptions.MaxDepth = Options.MaxDepth;
    ExportOptions.PropertyFilter = Options.PropertyFilter;
    ExportOptions.CategoryFilter = Options.CategoryFilter;

    TArray<TSharedPtr<FJsonValue>> PropertyMeta;
    TSharedPtr<FJsonObject> Properties = McpPropertyReflection::ExportObjectToJsonDetailed(Asset, ExportOptions, &PropertyMeta);
    Result->SetObjectField(TEXT("properties"), Properties.IsValid() ? Properties : MakeShared<FJsonObject>());
    Result->SetArrayField(TEXT("propertyMeta"), PropertyMeta);
    Result->SetNumberField(TEXT("propertyCount"), PropertyMeta.Num());

    return Result;
}
}
