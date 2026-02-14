# Backend .NET 8
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 7012

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["VehicleFleetManagement.Server.csproj", "./"]
RUN dotnet restore "./VehicleFleetManagement.Server.csproj"
COPY . .
RUN dotnet publish "./VehicleFleetManagement.Server.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "VehicleFleetManagement.Server.dll"]
