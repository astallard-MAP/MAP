{ pkgs, ... }: {
  # Stability channel
  channel = "stable-23.11";

  # Core packages
  packages = [
    pkgs.nodejs_20
  ];

  # Essential extensions
  idx.extensions = [
    "lucide-remote.lucide-icons"
    "dsznajder.es7-react-js-snippets"
  ];

  # Enable the preview engine
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}