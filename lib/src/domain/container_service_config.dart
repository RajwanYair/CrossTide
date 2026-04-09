/// Container Service Config — Docker/Podman Compose service descriptors for the dev stack.
library;

import 'package:equatable/equatable.dart';

/// Container runtime used to run the Compose stack.
enum ContainerRuntime {
  /// Docker Engine / Docker Desktop.
  docker,

  /// Podman (daemonless, rootless alternative).
  podman,
}

/// Functional role of a service in the development stack.
enum ServiceRole {
  /// Relational database (e.g. PostgreSQL).
  database,

  /// In-memory cache (e.g. Redis).
  cache,

  /// Market data / exchange simulator for local testing.
  simulator,

  /// Reverse proxy or load balancer (e.g. Nginx).
  proxy,

  /// Observability stack (Prometheus, Grafana).
  monitoring,
}

/// Descriptor for a single service in the Compose stack.
class ContainerService extends Equatable {
  const ContainerService({
    required this.name,
    required this.image,
    required this.tag,
    required this.ports,
    required this.role,
    this.healthCheck,
    this.environment,
  });

  /// Service name as it appears in `docker-compose.yml`.
  final String name;

  /// Container image name (without tag), e.g. `postgres`.
  final String image;

  /// Image tag, e.g. `15-alpine`.
  final String tag;

  /// Port mappings in `host:container` format.
  final List<String> ports;

  final ServiceRole role;

  /// Health-check command string (optional).
  final String? healthCheck;

  /// Environment variable overrides.
  final Map<String, String>? environment;

  /// Full image reference including tag.
  String get imageRef => '$image:$tag';

  @override
  List<Object?> get props => [
    name,
    image,
    tag,
    ports,
    role,
    healthCheck,
    environment,
  ];
}

/// A complete Compose project definition for the CrossTide dev stack.
class ContainerComposeConfig extends Equatable {
  const ContainerComposeConfig({
    required this.projectName,
    required this.services,
    required this.runtime,
    required this.composeVersion,
  });

  /// Standard CrossTide development stack.
  factory ContainerComposeConfig.devStack() => const ContainerComposeConfig(
    projectName: 'crosstide-dev',
    runtime: ContainerRuntime.docker,
    composeVersion: '3.9',
    services: [
      ContainerService(
        name: 'postgres',
        image: 'postgres',
        tag: '15-alpine',
        ports: ['5432:5432'],
        role: ServiceRole.database,
        healthCheck: 'pg_isready -U crosstide',
        environment: {
          'POSTGRES_USER': 'crosstide',
          'POSTGRES_DB': 'crosstide_history',
        },
      ),
      ContainerService(
        name: 'redis',
        image: 'redis',
        tag: '7-alpine',
        ports: ['6379:6379'],
        role: ServiceRole.cache,
        healthCheck: 'redis-cli ping',
      ),
      ContainerService(
        name: 'exchange-sim',
        image: 'ghcr.io/crosstide/exchange-simulator',
        tag: 'latest',
        ports: ['8090:8090'],
        role: ServiceRole.simulator,
      ),
      ContainerService(
        name: 'prometheus',
        image: 'prom/prometheus',
        tag: 'latest',
        ports: ['9090:9090'],
        role: ServiceRole.monitoring,
      ),
    ],
  );

  /// Compose project name (used as container name prefix).
  final String projectName;

  final List<ContainerService> services;

  final ContainerRuntime runtime;

  /// Compose file schema version string (e.g. '3.9').
  final String composeVersion;

  /// Returns services whose [role] matches [targetRole].
  List<ContainerService> servicesWithRole(ServiceRole targetRole) =>
      services.where((ContainerService s) => s.role == targetRole).toList();

  @override
  List<Object?> get props => [
    projectName,
    services,
    runtime,
    composeVersion,
  ];
}
