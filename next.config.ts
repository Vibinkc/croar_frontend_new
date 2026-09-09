const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },

  /**
   * Old admin routes, now living under /enterprise/administration.
   *
   * Settings, Team, Permissions, Integrations, Credits, Templates and Job Portals used to sit
   * scattered across the sidebar's "General" group. They are one module now, reached only
   * through Administration, so each old path forwards to its new home.
   *
   * These are redirects rather than twelve stub pages because there is one canonical location
   * per screen and this keeps that fact in one file. They are `permanent: false` on purpose:
   * a 308 is cached by browsers indefinitely, and if any of these paths is ever wanted back,
   * a cached permanent redirect is very hard to undo on a machine that has already seen it.
   *
   * ~38 links inside the app still point at the old paths; they keep working through these,
   * and get updated as those pages are touched.
   */
  async redirects() {
    const moved: [string, string][] = [
      ["/enterprise/settings", "/enterprise/administration/account-and-users/account"],
      ["/enterprise/team", "/enterprise/administration/account-and-users/users"],
      ["/enterprise/settings/roles", "/enterprise/administration/account-and-users/roles"],
      ["/enterprise/settings/job-portals", "/enterprise/administration/job-boards/portals"],
      ["/enterprise/integrations", "/enterprise/administration/integrations/tools"],
      ["/enterprise/credits", "/enterprise/administration/credits/wallet"],
      ["/enterprise/templates", "/enterprise/administration/customization/templates"],
    ];
    return [
      ...moved.map(([source, destination]) => ({ source, destination, permanent: false })),
      // Sub-routes keep their shape under the new parent, so one wildcard covers all of them
      // (email-templates, assessments, interview-templates, onboarding-templates and its
      // create/edit screens) rather than five more entries that could drift apart.
      {
        source: "/enterprise/templates/:path*",
        destination: "/enterprise/administration/customization/templates/:path*",
        permanent: false,
      },
      {
        source: "/enterprise/integrations/:path*",
        destination: "/enterprise/administration/integrations/tools/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
